import React, { useState, useEffect } from "react";
import AdminPageLayout from "./AdminPageLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useAdminRouteGuard } from "../../hooks/useAdminRouteGuard";
import API_BASE_URL from "../../config/api";

interface CountryRow {
  country: string;
  userCount: number;
}

export default function AdminCountriesPage() {
  useAdminRouteGuard();
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/admin/countries`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load countries");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data.countries) setCountries(data.countries);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminPageLayout
      title="Countries"
      description="Unique countries from registered users (derived from user address/location)"
    >
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          Loading...
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">#</TableHead>
                <TableHead className="font-semibold text-gray-700">Country</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Users</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                    No countries found. User addresses may not include country data yet.
                  </TableCell>
                </TableRow>
              ) : (
                countries.map((row, index) => (
                  <TableRow key={row.country} className="hover:bg-[#FE8A0F]/5">
                    <TableCell className="text-gray-600">{index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{row.country}</TableCell>
                    <TableCell className="text-right text-gray-700">{row.userCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPageLayout>
  );
}
