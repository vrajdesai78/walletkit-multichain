import { Button } from "@/components/ui/button";
import { CopyIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import toast from "react-hot-toast";
import { getAddress, getBalance, getUsdcBalance } from "@/utils/helper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChainStore } from "@/store/chain";
import { TChain } from "@/types";

export function WalletDetails() {
  const { chain, setChain } = useChainStore();

  const { data: balances = { native: "0", usdc: "0" } } = useQuery({
    queryKey: ["balances", chain],
    queryFn: async () => {
      try {
        console.log("Fetching balances for chain:", chain);
        const native = await getBalance();
        console.log("Received native balance:", native);
        const usdc = await getUsdcBalance();
        console.log("Received USDC balance:", usdc);
        return { native, usdc };
      } catch (error) {
        console.error("Error in balance query:", error);
        return { native: "0", usdc: "0" };
      }
    },
    retry: false,
    refetchInterval: false,
  });

  const queryClient = useQueryClient();

  return (
    <div
      key={chain}
      className='bg-white/50 backdrop-blur-sm p-4 rounded-xl shadow border border-gray-100'
    >
      <div className='flex items-center justify-between mb-4'>
        <Select
          defaultValue={chain}
          onValueChange={(value) => {
            queryClient.invalidateQueries({ queryKey: ["balances"] });
            setChain(value as TChain);
          }}
        >
          <SelectTrigger className='w-[160px] h-7 text-xs bg-blue-100/80 text-blue-800 border-0'>
            <div className='w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse'></div>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='sepolia'>Sepolia</SelectItem>
            <SelectItem value='base-sepolia'>Base Sepolia</SelectItem>
            <SelectItem value='solana-devnet'>Solana Devnet</SelectItem>
            <SelectItem value='polkadot-westend'>Polkadot Westend</SelectItem>
          </SelectContent>
        </Select>
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
          {Number(balances.native).toFixed(4)}{" "}
          {chain === "solana-devnet"
            ? "SOL"
            : chain === "polkadot-westend"
            ? "WND"
            : "ETH"}
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
