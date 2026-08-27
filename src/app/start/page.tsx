import { redirect } from "next/navigation";

export const metadata = {
  title: "Start with Klinikos",
  description: "Tell Klinikos what needs to happen and continue into the right governed experience.",
};

/**
 * Compatibility route for older links.
 *
 * Final-form Klinikos no longer asks a new visitor to understand product taxonomy before
 * receiving value. The Universal Entry Router owns the current start experience.
 */
export default function StartPage() {
  redirect("/auth");
}
