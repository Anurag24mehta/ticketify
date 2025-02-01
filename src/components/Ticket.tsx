"use client"

import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";

type TicketProp = {
    name: string,
    description: string,
    image: string,
    attributes: { trait_type: string, value: string }[]
}

// Ticket Component Example
export function Ticket({ name, description, image, attributes}: TicketProp) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{name}</CardTitle>
            </CardHeader>
            <CardContent>
                <img src={image} alt={name}/>
                <CardDescription>{description}</CardDescription>
                <div>
                    {attributes.map((attr, index) => (
                        <div key={index}>
                            <strong>{attr.trait_type}: </strong>{attr.value}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
