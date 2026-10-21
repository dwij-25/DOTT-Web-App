import Link from "next/link";
import { Download, CheckCircle, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function SuccessPage({ searchParams }: { searchParams: { order_id?: string } }) {
  const orderId = searchParams.order_id;
  
  let transactionId = null;
  if (orderId) {
    const order = await prisma.order.findUnique({ where: { order_number: orderId } });
    transactionId = order?.razorpay_payment_id || order?.razorpay_order_id;
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-16 px-8 flex flex-col items-center justify-center font-body text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#b4ff39]/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="border border-white/10 bg-white/5 backdrop-blur-md p-12 flex flex-col items-center max-w-lg w-full text-center relative z-10">
        <div className="w-20 h-20 bg-[#b4ff39]/10 rounded-full flex items-center justify-center mb-8 border border-[#b4ff39]/30">
          <CheckCircle className="w-10 h-10 text-[#b4ff39]" />
        </div>
        
        <h1 className="font-display text-4xl font-extrabold tracking-widest mb-4">YOUR DROP IS SECURED.</h1>
        <p className="text-white/50 text-sm tracking-widest mb-8 leading-relaxed">
          The payment is done and your order has been confirmed. You will receive an email confirmation shortly.
        </p>

        {orderId && (
          <div className="flex flex-col gap-2 w-full mb-8">
            <div className="border border-white/10 bg-black/50 p-4 w-full flex justify-between items-center">
              <span className="text-[10px] text-white/50 tracking-widest uppercase">ORDER ID</span>
              <span className="font-display font-bold tracking-[0.2em]">{orderId}</span>
            </div>
            {transactionId && (
              <div className="border border-white/10 bg-black/50 p-4 w-full flex justify-between items-center">
                <span className="text-[10px] text-white/50 tracking-widest uppercase">TRANSACTION ID</span>
                <span className="font-display font-bold tracking-[0.2em] text-[#b4ff39]">{transactionId}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col w-full gap-4">
          {orderId && (
            <Link 
              href={`/invoice/${orderId}`}
              target="_blank"
              className="w-full bg-[#b4ff39] text-black font-bold py-4 px-8 tracking-widest text-xs hover:bg-[#b4ff39]/80 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD INVOICE
            </Link>
          )}
          <Link 
            href="/profile"
            className="w-full border border-white/20 bg-transparent text-white font-bold py-4 px-8 tracking-widest text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            TRACK IN MY PACK
          </Link>
        </div>
      </div>
    </main>
  );
}
