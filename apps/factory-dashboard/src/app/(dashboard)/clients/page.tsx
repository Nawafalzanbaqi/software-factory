import type { Metadata } from "next";
import Link from "next/link";
import { platformApi, type ClientDto } from "@/lib/platform-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Clients" };

// Admin data is always fresh.
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  let clients: ClientDto[] = [];
  let loadError = false;
  try {
    clients = await platformApi.listClients();
  } catch {
    loadError = true;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="text-sm text-muted-foreground">
          Every client the factory is building for.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All clients</CardTitle>
          <CardDescription>
            {loadError
              ? "Could not reach the Platform API."
              : `${clients.length} client${clients.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="text-sm text-destructive" role="alert">
              Failed to load clients. Check that the Platform API is running.
            </p>
          ) : clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clients yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.contactEmail ? (
                        <a
                          href={`mailto:${client.contactEmail}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {client.contactEmail}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateTime(client.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Looking for the pipeline?{" "}
        <Link
          href="/projects"
          className="text-primary underline-offset-4 hover:underline"
        >
          View all projects
        </Link>
        .
      </p>
    </div>
  );
}
