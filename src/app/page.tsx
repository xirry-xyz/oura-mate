import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import LandingClient from "./LandingClient"

export default async function LandingPage() {
    // Determine if we should auto-redirect to /app
    // We redirect IF: it's not the official demo site AND the user has already set an admin password.
    const headersList = await headers()
    const host = headersList.get("host") || ""
    const isOfficialSite = host.includes("oura-mate.xirry.xyz") || host.includes("oura-mate.vercel.app")

    if (!isOfficialSite) {
        const hasPassword = await db.getPassword()
        if (hasPassword) {
            redirect("/app")
        }
    }

    return <LandingClient />
}
