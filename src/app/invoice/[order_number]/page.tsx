import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InvoicePage(props: { params: Promise<{ order_number: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const order = await prisma.order.findUnique({
    where: { order_number: params.order_number },
    include: {
      items: {
        include: { sticker: true }
      },
      user: true
    }
  });

  if (!order) {
    return <div className="p-8 font-mono">Invoice not found.</div>;
  }

  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });

  // Ensure owner or admin can view the invoice
  const isAdmin = currentUser?.role === "ADMIN" || session.user.email === "dottdrop@gmail.com";
  if (order.user.email !== session.user.email && !isAdmin) {
    return <div className="p-8 font-mono">Unauthorized access.</div>;
  }

  return (
    <div className="bg-white min-h-screen text-black font-mono p-8 max-w-4xl mx-auto">
      {/* Print Button (Hidden in print mode via CSS) */}
      <div 
        className="flex justify-end mb-8 print:hidden" 
        dangerouslySetInnerHTML={{ __html: '<button onclick="window.print()" class="bg-black text-white px-6 py-2 text-xs font-bold tracking-widest hover:bg-gray-800">PRINT / SAVE PDF</button>' }}
      />

      {/* Header */}
      <div className="border-b-2 border-black pb-8 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter mb-1">DOTT.</h1>
          <div className="text-xs tracking-widest text-gray-500 uppercase">Make Your Mark.</div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold mb-1">TAX INVOICE</h2>
          <div className="text-xs text-gray-500">#{order.order_number}</div>
          <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500 mt-1">TXN: {order.razorpay_payment_id || order.razorpay_order_id || "N/A"}</div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-16 mb-12">
        <div>
          <div className="text-xs font-bold tracking-widest mb-2 border-b border-gray-300 pb-1">BILLED TO</div>
          <div className="text-sm font-bold">{(order.delivery_address as any)?.billerName || order.user.name || "Customer"}</div>
          <div className="text-xs text-gray-600 mt-1">{order.user.email}</div>
          <div className="text-xs text-gray-600 mt-1">Mobile: {(order.delivery_address as any)?.billerMobile || "N/A"}</div>
        </div>
        <div>
          <div className="text-xs font-bold tracking-widest mb-2 border-b border-gray-300 pb-1">SHIPPED TO</div>
          <div className="text-xs leading-relaxed whitespace-pre-wrap">
            {order.delivery_address ? (
              typeof order.delivery_address === 'string' 
                ? order.delivery_address 
                : `${(order.delivery_address as any).houseFlat}, ${(order.delivery_address as any).streetArea}, ${(order.delivery_address as any).city}, ${(order.delivery_address as any).state}, ${(order.delivery_address as any).country} - ${(order.delivery_address as any).pincode}`
            ) : "Address not provided."}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-12">
        <div className="grid grid-cols-12 gap-4 border-b-2 border-black pb-2 mb-4 text-xs font-bold tracking-widest">
          <div className="col-span-1">#</div>
          <div className="col-span-7">ITEM DESCRIPTION</div>
          <div className="col-span-2 text-center">QTY</div>
          <div className="col-span-2 text-right">TOTAL</div>
        </div>
        
        {order.items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-12 gap-4 border-b border-gray-200 py-4 text-sm items-center">
            <div className="col-span-1 text-gray-400">{index + 1}</div>
            <div className="col-span-7 font-bold">{item.sticker.name}</div>
            <div className="col-span-2 text-center">{item.quantity}</div>
            <div className="col-span-2 text-right">₹{(item.price * item.quantity / 100).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between text-xs py-2 border-b border-gray-200">
            <span>SUBTOTAL</span>
            <span>₹{(order.subtotal / 100).toFixed(2)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-xs py-2 border-b border-gray-200 text-green-700">
              <span>DISCOUNT {order.promo_code_used ? `(${order.promo_code_used})` : ""}</span>
              <span>-₹{(order.discount_amount / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs py-2 border-b border-gray-200">
            <span>SHIPPING</span>
            <span>{order.delivery_charge === 0 ? "FREE" : `₹${(order.delivery_charge / 100).toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-sm font-bold py-4 border-b-2 border-black">
            <span>TOTAL AMOUNT</span>
            <span>₹{(order.total / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-xs text-gray-400 border-t border-gray-200 pt-8">
        <div>Thank you for securing a drop with DOTT.</div>
        <div>If you have any questions about this invoice, contact dottdrop@gmail.com</div>
      </div>

      {/* Auto-print script */}
      <script dangerouslySetInnerHTML={{ __html: `
        window.onload = function() {
          // Optional: setTimeout(() => window.print(), 500);
        }
      `}} />
    </div>
  );
}
