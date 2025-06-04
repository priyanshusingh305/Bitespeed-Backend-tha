"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, User, Mail, Phone, Hash } from "lucide-react";

interface IdentifyResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

interface Contact {
  id: number;
  email: string | null;
  phoneNumber: string | null;
  linkedId: number | null;
  linkPrecedence: "primary" | "secondary";
  createdAt: string;
  updatedAt: string;
}

interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ContactIdentifyApp() {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [identifyResponses, setIdentifyResponses] = useState<
    IdentifyResponse[]
  >([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);

  // Fetch all contacts on component mount
  useEffect(() => {
    fetchAllContacts(currentPage);
  }, [currentPage]);

  const fetchAllContacts = async (page = 1) => {
    try {
      const response = await fetch(
        `http://localhost:3500/getall?page=${page}&limit=${pageLimit}`
      );
      if (response.ok) {
        const data: ContactsResponse = await response.json();
        setAllContacts(data.contacts);
        setTotalPages(data.pagination.totalPages);
        setTotalContacts(data.pagination.total);
        setCurrentPage(data.pagination.page);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    }
  };

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email && !phoneNumber) {
      setError("Please provide either email or phone number");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3500/identify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email || undefined,
          phoneNumber: phoneNumber || undefined,
        }),
      });

      if (response.ok) {
        const data: IdentifyResponse = await response.json();
        setIdentifyResponses((prev) => [data, ...prev]);

        // Refresh contacts list
        await fetchAllContacts(currentPage);

        // Clear form
        setEmail("");
        setPhoneNumber("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to identify contact");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Bitespeed Backend Task: Identity Reconciliation
        </h1>
        <p className="text-muted-foreground">
          Test the /identify API endpoint and view contact data in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identify Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Call /identify API
            </CardTitle>
            <CardDescription>
              Enter email or phone number to call the /identify endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIdentify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Identifying...
                  </>
                ) : (
                  "Identify Contact"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* All Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              All Contacts ({totalContacts}) - Page {currentPage} of{" "}
              {totalPages}
            </CardTitle>
            <CardDescription>
              Complete list of contacts in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {allContacts.map((contact) => (
                  <div key={contact.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{contact.id}</span>
                        <Badge
                          variant={
                            contact.linkPrecedence === "primary"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {contact.linkPrecedence}
                        </Badge>
                      </div>
                      {contact.linkedId && (
                        <span className="text-xs text-muted-foreground">
                          Linked to: {contact.linkedId}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{contact.phoneNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(contact.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}

                {allContacts.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No contacts found
                  </div>
                )}
              </div>
            </ScrollArea>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageLimit + 1} to{" "}
                  {Math.min(currentPage * pageLimit, totalContacts)} of{" "}
                  {totalContacts} contacts
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAllContacts(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                        i;
                      if (pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => fetchAllContacts(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAllContacts(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Identify Responses */}
      {identifyResponses.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              /identify API Responses
            </CardTitle>
            <CardDescription>
              History of responses from the /identify endpoint calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {identifyResponses.map((response, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">
                        Response #{identifyResponses.length - index}
                      </h4>
                      <Badge>
                        Primary ID: {response.contact.primaryContatctId}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Emails ({response.contact.emails.length})
                        </h5>
                        <div className="space-y-1">
                          {response.contact.emails.map((email, i) => (
                            <div
                              key={i}
                              className="text-sm bg-muted px-2 py-1 rounded"
                            >
                              {email}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Phone Numbers ({response.contact.phoneNumbers.length})
                        </h5>
                        <div className="space-y-1">
                          {response.contact.phoneNumbers.map((phone, i) => (
                            <div
                              key={i}
                              className="text-sm bg-muted px-2 py-1 rounded"
                            >
                              {phone}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Secondary IDs (
                          {response.contact.secondaryContactIds.length})
                        </h5>
                        <div className="space-y-1">
                          {response.contact.secondaryContactIds.map((id, i) => (
                            <div
                              key={i}
                              className="text-sm bg-muted px-2 py-1 rounded font-mono"
                            >
                              {id}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
