import { Button } from "@/components/ui/button";
import { CopyIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import toast from "react-hot-toast";
import { getAddress, getBalance, getUsdcBalance } from "@/utils/helper";
import { useQuery } from "@tanstack/react-query";

export function WalletDetails() {
  const { data: balances = { eth: "0", usdc: "0" } } = useQuery({
    queryKey: ["balances"],
    queryFn: async () => {
      const [eth, usdc] = await Promise.all([getBalance(), getUsdcBalance()]);
      return { eth, usdc };
    },
  });

  return (
    <div className='bg-white/50 backdrop-blur-sm p-4 rounded-xl shadow border border-gray-100'>
      <div className='flex items-center justify-between mb-4'>
        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100/80 text-blue-800'>
          <div className='w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse'></div>
          Sepolia
        </span>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 px-2 hover:bg-gray-100/80'
          onClick={() => {
            navigator.clipboard.writeText(getAddress());
            toast.success("Address copied");
          }}
        >
          <div className='font-mono text-xs text-gray-600'>
            {getAddress().slice(0, 6)}...{getAddress().slice(-4)}
          </div>
          <CopyIcon className='h-3 w-3 ml-1.5' />
        </Button>
      </div>

      {/* Balance */}
      <div className='bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg mb-4'>
        <p className='text-xs text-gray-500'>Total Balance</p>
        <div className='text-3xl font-bold text-gray-900 mt-1 mb-0.5'>
          {Number(balances.eth).toFixed(4)} ETH
        </div>
      </div>

      {/* Tokens */}
      <div className='space-y-2'>
        <div className='flex items-center justify-center px-1 text-xs'>
          <p className='font-medium text-gray-600'>Tokens</p>
        </div>

        <div className='bg-white/80 rounded-lg p-2 hover:bg-gray-50/80'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Image
                src='https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
                alt='USDC'
                width={28}
                height={28}
                className='rounded-full ring-1 ring-gray-100'
                loader={({ src }) => src}
              />
              <div>
                <p className='font-medium text-sm text-gray-900'>USDC</p>
              </div>
            </div>
            <div className='text-right'>
              <div className='font-medium text-sm'>{balances.usdc}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
