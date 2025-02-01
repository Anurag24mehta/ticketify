"use client";
import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { Account } from "thirdweb/wallets";
import { readContract } from "thirdweb";
import { CONTRACT } from "@/blockChain/constants";
import { Loader } from "lucide-react";
import { Ticket } from "@/components/Ticket";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MyTickets() {
    const activeAccount = useActiveAccount();
    const [account, setAccount] = useState<Account | null>(null);
    const [data, setData] = useState<any[]>([]); // Change to any[] for flexible data structure
    const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state

    useEffect(() => {
        setIsLoading(true);
        if (activeAccount) {
            setAccount(activeAccount);
        }
    }, [activeAccount]);

    useEffect(() => {
        // Fetch NFTs if account is set
        if (account) {
            const fetchNFTs = async () => {
                try {
                    const result = await readContract({
                        contract: CONTRACT,
                        method: "getNFTsByOwner",
                        params: [account.address]
                    });
                    console.log(result);
                    // Parse each NFT string into a JSON object
                    const parsedResult = result.map((nft) => JSON.parse(nft));
                    console.log(parsedResult);
                    setData(parsedResult);
                } catch (error) {
                    console.error("Error fetching NFTs:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchNFTs();
        }
    }, [account]); // Only run when the account is available

    return (
        <div>
            {isLoading ? (
                <div className="flex justify-center items-center h-screen">
                    <Loader className="animate-spin"/>
                </div>

            ) : (
                <div>
                    <h1 className="text-3xl font-bold mb-4">My Tickets</h1>
                    {data.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {data.map((nft, index) => (
                                <Ticket
                                    key={index}
                                    name={nft.name}
                                    description={nft.description}
                                    image={nft.image}
                                    attributes={nft.attributes}
                                />
                            ))}
                        </div>
                    ) : (
                        <p>No tickets found.</p>
                    )}
                </div>
            )}
        </div>
    );
}
