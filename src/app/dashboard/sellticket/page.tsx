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
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {toWei} from "thirdweb";

type AttributeType = {
    trait_type: string;
    value: string;
}

export default function SellTicket() {
    const activeAccount = useActiveAccount();
    const [account, setAccount] = useState<Account | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [price, setPrice] = useState<number>(0.006); // Default price in ETH
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

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
                        method: "getNFTsByOwner",
                        params: [account.address],
                    });
                    console.log(result);
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

    const handleSell = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!account || !selectedSeat) {
            toast({
                title: "Error",
                description: "Please select a seat and connect your wallet.",
                variant: "destructive",
            });
            return;
        }

        try {
            const transaction = prepareContractCall({
                contract: CONTRACT,
                method: "listSeatForSale",
                params: [
                    selectedSeat, // Seat number
                    toWei(price.toString())// Price in ETH
                ]
            });
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
            console.log("Listing seat:", selectedSeat, "for", price, "ETH");
        } catch (error) {
            console.error("Error listing seat:", error);
            toast({
                title: "Transaction Failed",
                description: "Could not list the ticket for sale.",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            {isLoading ? (
                <div className="flex justify-center items-center h-screen">
                    <Loader className="animate-spin" />
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
                                        <img src={nft.image} alt={nft.name} />
                                        <CardDescription>{nft.description}</CardDescription>
                                        <div>
                                            {nft.attributes.map((attr: AttributeType , index: number) => (
                                                <div key={index}>
                                                    <strong>{attr.trait_type}: </strong>
                                                    {attr.value}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button onClick={() => setSelectedSeat(nft.attributes[0].value)}>
                                                    Sell Ticket
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Set Ticket Price</DialogTitle>
                                                    <DialogDescription>
                                                        Select the price before listing your ticket for sale.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <form onSubmit={handleSell} className="space-y-4">
                                                    <div>
                                                        <Label>Price (ETH)</Label>
                                                        <Slider
                                                            min={0.005}
                                                            max={0.007}
                                                            step={0.0001}
                                                            value={[price]}
                                                            onValueChange={(val) => setPrice(val[0])}
                                                        />
                                                        <Input
                                                            type="text"
                                                            value={price.toFixed(4)}
                                                            readOnly
                                                            className="mt-2"
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit">Continue</Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
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
