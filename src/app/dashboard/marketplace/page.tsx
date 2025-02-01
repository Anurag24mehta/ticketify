"use client";

import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { Account } from "thirdweb/wallets";
import {prepareContractCall, readContract, sendAndConfirmTransaction} from "thirdweb";
import { CONTRACT } from "@/blockChain/constants";
import { Loader } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import{toEther} from "thirdweb/utils";
import {Button} from "@/components/ui/button";
import {toast} from "@/hooks/use-toast";

type AttributeType = {
    trait_type: string;
    value: string;
}

export default function Marketplace() {
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
        if (account) {
            const fetchNFTs = async () => {
                try {
                    const result = await readContract({
                        contract: CONTRACT,
                        method: "listSeatsOnSale",
                        params: [],
                    });

                    console.log("Fetched NFTs:", result);
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
    }, [account]);

    const handleBuy = async (seatNumber: string, price: bigint) => {
        if (!account) {
            toast({
                title: "Please connect your wallet",
                variant: "destructive",
            })
            return;
        }
        try {
            console.log(price);
            console.log(seatNumber);

            const transaction = prepareContractCall({
                contract: CONTRACT,
                method: "buySeat",
                params: [seatNumber],
                value: price
            })
            const loadingToast = toast({
                title: "Transaction in progress",
                description: "Please wait while your transaction is being processed...",
                duration: Infinity,
            });


            const receipt = await sendAndConfirmTransaction({
                transaction,
                account,
            });

            loadingToast.dismiss();

            if (!receipt) {
                toast({
                    title: "Transaction Failed",
                    description: "Something went wrong. Please try again.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Transaction Successful",
                    description: "Your ticket has been booked successfully!",
                });
            }

        } catch (error) {
            console.error("Error purchasing ticket:", error);
            toast({
                title: "Transaction Failed",
                description: "Could not purchase the ticket.",
                variant: "destructive",
            });
        }
    };

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
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle>{nft.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <img src={nft.image} alt={nft.name}/>
                                        <CardDescription>{nft.description}</CardDescription>
                                        <p>{toEther(nft.price)} ETH</p>
                                        <div>
                                            {nft.attributes.map((attr: AttributeType, index: number) => (
                                                <div key={index}>
                                                    <strong>{attr.trait_type}: </strong>
                                                    {attr.value}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => handleBuy(nft.attributes[0].value, nft.price)}>
                                            Buy Now
                                        </Button>
                                    </CardFooter>
                                </Card>
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
