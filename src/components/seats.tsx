"use client"
import { Button } from "@/components/ui/button";
import {useEffect, useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

import ReCAPTCHA from "react-google-recaptcha";
import {useActiveAccount, useContractEvents} from "thirdweb/react";
import  {tokensClaimedEvent} from "thirdweb/extensions/erc721";
import {Account} from "thirdweb/wallets";
import {toast} from "@/hooks/use-toast";
import {prepareContractCall, sendAndConfirmTransaction, sendTransaction} from "thirdweb";
import {CONTRACT} from "@/blockChain/constants";

type SeatSelectionProps = {
    disabledSeats?: string[];
    refreshSeats: () => void;  // Function to refresh booked seats
};

export default function SeatSelection({ disabledSeats = [], refreshSeats }: SeatSelectionProps) {
    const activeAccount = useActiveAccount();
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]); // Track selected seats
    const[captcha, setCaptcha] = useState<string | null>("");
    const[account, setAccount] = useState<Account | null>(null);

    //to retreive the information about connect wallet
    useEffect(() => {
        if(activeAccount){
            setAccount(activeAccount);
        }
    }, [activeAccount]);

    const handleSeatClick = (seatNo: string) => {
        // Toggle seat selection
        setSelectedSeats(prevSelected =>
            prevSelected.includes(seatNo)
                ? prevSelected.filter(seat => seat !== seatNo) // Deselect if already selected
                : [...prevSelected, seatNo] // Add to selected seats
        );
    };

    const handlePay = async () => {
        if (!account) {
            toast({
                title: "Connect Wallet",
                description: "Please connect your wallet to proceed.",
                variant: "destructive",
            });
            return;
        }

        try {
            const transaction = prepareContractCall({
                contract: CONTRACT,
                method: "claim",
                params: [account.address, BigInt(selectedSeats.length), selectedSeats],
                value: BigInt(selectedSeats.length) * BigInt(5000000000000000),
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

                // Soft Reload: Refresh the booked seats list
                refreshSeats();

                // Clear selected seats
                setSelectedSeats([]);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Generate seat labels like A1, A2, ..., A10, B1, B2, ..., B10, ...
    const generateSeats = () => {
        const seats: string[] = [];
        const rows = 5; // 5 rows
        const cols = 10; // 10 seats per row
        const rowLabels = ['A', 'B', 'C', 'D', 'E']; // Row labels A-E (5 rows)

        for (let row = 0; row < rows; row++) {
            for (let col = 1; col <= cols; col++) {
                seats.push(`${rowLabels[row]}${col}`);
            }
        }

        return seats;
    };

    return (
        <div className="flex flex-col items-center border rounded-2xl p-6 shadow-lg space-y-6">
            <div className="border rounded-lg w-full text-center py-4 bg-gray-200 font-bold">Stage</div>
            <div className="grid grid-cols-10 gap-2"> {/* 10 seats per row */}
                {generateSeats().map((seatNo) => {
                    const isDisabled = disabledSeats.includes(seatNo);
                    const isSelected = selectedSeats.includes(seatNo); // Check if the seat is selected
                    return (
                        <div key={seatNo} className="flex items-center justify-center w-16 h-16">
                            <Button
                                className={`w-full h-full rounded-lg transition-transform transform hover:scale-105 shadow-md flex items-center justify-center 
                                    ${isDisabled ? 'bg-gray-400 text-white cursor-not-allowed' :
                                    isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-black hover:shadow-lg'}`}
                                onClick={() => !isDisabled && handleSeatClick(seatNo)}
                                disabled={isDisabled}
                            >
                                <span className={isDisabled ? 'line-through decoration-red-800 ' : ''}>
                                    {seatNo}
                                </span>
                            </Button>
                        </div>
                    );
                })}
            </div>
            <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
                onChange={setCaptcha}
            />

            {/* Submit Button */}
            <div className="mt-6">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" disabled={!selectedSeats.length || !captcha}>Submit</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Warnings</DialogTitle>
                            <DialogDescription>
                                <br/>
                                <p className={"text-1xl"}>Transaction Fees might fluctuate</p>
                                <p>To increase your chance of booking pay higher transaction fees</p>
                                <p>Seats Selected - {selectedSeats.join(",")}</p>
                                <p>Amount payable - ${selectedSeats.length*0.005} ETH</p>
                                <br/>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="submit" onClick={handlePay}>Continue to pay</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
