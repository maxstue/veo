import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, LoaderCircle, TicketCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { getInvitation, getViewer, redeemInvitation } from "#/lib/teams";

export const Route = createFileRoute("/invite/$token")({
  loader: async ({ params }) => ({
    invitation: await getInvitation({ data: { token: params.token } }),
    viewer: await getViewer(),
  }),
  component: InvitationPage,
});

function InvitationPage() {
  const { invitation, viewer } = Route.useLoaderData();
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string>();
  const returnTo = `/invite/${token}`;

  async function redeem() {
    setIsRedeeming(true);
    setError(undefined);
    try {
      const result = await redeemInvitation({ data: { token } });
      await navigate({ to: "/teams/$teamId", params: { teamId: result.teamId } });
    } catch {
      setError("This invitation could not be redeemed. It may already have been used.");
      setIsRedeeming(false);
    }
  }

  const valid = invitation.status === "valid";

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-md border-0 text-center shadow-2xl shadow-primary/10">
        <CardHeader>
          <Link className="mx-auto mb-4 flex items-center gap-2 no-underline" to="/">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Eye className="size-5" aria-hidden="true" />
            </span>
            <span className="font-heading text-xl font-semibold">veo</span>
          </Link>
          <span
            className={`mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl ${valid ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"}`}
          >
            {valid ? <TicketCheck aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
          </span>
          <CardTitle>
            {valid ? `Invitation to ${invitation.teamName}` : "Invitation unavailable"}
          </CardTitle>
          <CardDescription>
            {valid
              ? "Accept the invitation and join this Veo team."
              : unavailableText[invitation.status]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {valid && !viewer && (
            <Button asChild className="w-full" size="lg">
              <Link search={{ returnTo }} to="/auth">
                Sign in and join
              </Link>
            </Button>
          )}
          {valid && viewer && (
            <Button className="w-full" disabled={isRedeeming} onClick={redeem} size="lg">
              {isRedeeming && <LoaderCircle className="animate-spin" aria-hidden="true" />}Join as{" "}
              {viewer.name}
            </Button>
          )}
          {error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {!valid && (
            <Button asChild className="w-full" variant="outline">
              <Link to="/">Go to home page</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

const unavailableText = {
  invalid: "This link is invalid.",
  expired: "This link has expired.",
  revoked: "This link has been revoked.",
  redeemed: "This link has already been redeemed.",
} as const;
