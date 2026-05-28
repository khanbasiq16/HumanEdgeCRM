"use client";

import React, { useState, useMemo } from "react";
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import MonthPicker from "../../superadmin/components/basecomponent/MonthPicker";


export default function Expensetable({ expenses, expenseCategory }) {
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(null); // YYYY-MM
    const [expenseType, setExpenseType] = useState("all"); // all | fixed | variable
    const [searchValue, setSearchValue] = useState("");

    // 🔹 FILTER LOGIC (ALL FEATURES)
    const filteredExpenses = useMemo(() => {
        return expenses.filter((exp) => {
            let valid = true;

            // 🔸 Category filter
            if (selectedCategories.length > 0) {
                valid =
                    valid &&
                    selectedCategories.includes(exp.expensecategoryName);
            }

            // 🔸 Month filter (YYYY-MM)
            if (selectedMonth) {
                const expMonth = new Date(exp.date)
                    .toISOString()
                    .slice(0, 7);
                valid = valid && expMonth === selectedMonth;
            }

            // 🔸 Fixed / Variable filter
            if (expenseType !== "all") {
                valid =
                    valid &&
                    exp.expensecategoryType?.toLowerCase() === expenseType;
            }

            // 🔸 Search filter
            if (searchValue) {
                valid =
                    valid &&
                    exp.expensecategoryName?.toLowerCase().includes(
                        searchValue.toLowerCase()
                    );
            }

            return valid;
        });
    }, [expenses, selectedCategories, selectedMonth, expenseType, searchValue]);

    // 🔹 TOTAL (Filtered)
    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce(
            (sum, exp) => sum + Number(exp.amount || 0),
            0
        );
    }, [filteredExpenses]);

    // 🔹 TABLE COLUMNS
    const columns = useMemo(
        () => [
            {
                accessorKey: "expensecategoryName",
                header: "Expense Category",
            },
            {
                accessorKey: "expensecategoryType",
                header: "Type",
                cell: ({ row }) => (
                    <span className="capitalize">
                        {row.getValue("expensecategoryType")}
                    </span>
                ),
            },
            {
                accessorKey: "amount",
                header: "Amount",
                cell: ({ row }) => <span>Rs {row.getValue("amount")}</span>,
            },
            {
                accessorKey: "Username",
                header: "Created By",
                cell: ({ row }) => <span> {row.getValue("Username")}</span>,
            },

            {
                accessorKey: "paymentMethod",
                header: "Payment Method",
                cell: ({ row }) => <span>{row.getValue("paymentMethod")}</span>,
            },
            {
                accessorKey: "date",
                header: "Date",
                cell: ({ row }) => {
                    const d = new Date(row.getValue("date"));
                    return d.toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    });
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data: filteredExpenses,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col space-y-4">
            {/* 🔹 TOTAL */}
            <div className="text-right font-bold text-lg">
                Total Expense Amount: Rs {totalAmount}
            </div>

            {/* 🔹 FILTERS */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}  
                <Input
                    placeholder="Search by title..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="max-w-sm"
                />

                {/* Month Picker */}
                <MonthPicker
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                />

                {/* Fixed / Variable */}
                <div className="flex gap-2">
                    <Button
                        variant={expenseType === "all" ? "default" : "outline"}
                        onClick={() => setExpenseType("all")}
                    >
                        All
                    </Button>
                    <Button
                        variant={expenseType === "fixed" ? "default" : "outline"}
                        onClick={() => setExpenseType("fixed")}
                    >
                        Fixed
                    </Button>
                    <Button
                        variant={
                            expenseType === "variable"
                                ? "default"
                                : "outline"
                        }
                        onClick={() => setExpenseType("variable")}
                    >
                        Variable
                    </Button>
                </div>

                {/* Category Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            Filter Categories
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-60 overflow-auto">
                        {expenseCategory.map((cat) => (
                            <DropdownMenuCheckboxItem
                                key={cat.id}
                                checked={selectedCategories.includes(
                                    cat.expenseCategoryName
                                )}
                                onCheckedChange={(checked) => {
                                    setSelectedCategories((prev) =>
                                        checked
                                            ? [
                                                ...prev,
                                                cat.expenseCategoryName,
                                            ]
                                            : prev.filter(
                                                (c) =>
                                                    c !==
                                                    cat.expenseCategoryName
                                            )
                                    );
                                }}
                            >
                                {cat.expenseCategoryName}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* 🔹 TABLE */}
            <div className="overflow-auto rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-center h-24"
                                >
                                    No Expenses Found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 🔹 PAGINATION */}
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
