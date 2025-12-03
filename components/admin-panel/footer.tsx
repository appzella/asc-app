import Link from "next/link";
import { Heart } from "lucide-react";

export function Footer() {
    return (
        <div className="z-20 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-4 md:mx-8 flex h-14 items-center">
                <p className="text-xs md:text-sm leading-loose text-muted-foreground text-left flex items-center">
                    Made with
                    <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" />
                    for{" "}
                    <Link
                        href="#"
                        className="font-medium underline underline-offset-4"
                    >
                        Alpiner Ski-Club St. Gallen
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
