"use client";

import { useEffect, useState } from "react";
import { readContract, prepareEvent } from "thirdweb";
import { CONTRACT } from "@/blockChain/constants";
import SeatSelection from "@/components/seats";

export default function Home() {
    const [disabledSeats, setDisabledSeats] = useState<string[]>([]);

    const fetchBookedSeats = async () => {
        try {
            const data = await readContract({
                contract: CONTRACT,
                method: "getBookedSeats",
                params: [],
            });
            setDisabledSeats([...data]);
        } catch (error) {
            console.error("Error fetching booked seats:", error);
        }
    };

    useEffect(() => {
        fetchBookedSeats();
    }, []);


    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto bg-gray-100 p-6 rounded-xl mb-4">
                <div className="text-center mb-4">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-2">
                        The Grand Summit
                    </h2>
                    <p className="text-lg text-gray-600 italic">A gathering of minds</p>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <span className="font-bold text-gray-800 mr-2">Place:</span>
                        <span className="text-gray-700">Convocation Hall</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold text-gray-800 mr-2">Date:</span>
                        <span className="text-gray-700">March 25, 2025</span>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <span className="font-bold text-gray-800 mr-2">Time:</span>
                        <span className="text-gray-700">5:00 PM</span>
                    </div>
                </div>
            </div>
            {/* Pass fetchBookedSeats to SeatSelection */}
            <SeatSelection
                disabledSeats={disabledSeats}
                refreshSeats={fetchBookedSeats}
            />
        </div>
    );
}