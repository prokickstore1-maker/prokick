"use client";

import { useState } from "react";
import { NormalizedJersey } from "@/lib/data";
import { createProductAction, deleteProductAction, updateProductAction, ProductInput } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const empty: ProductInput = { name: "", team: "", league: "Premier League", season: "2026/2027", type: "Fans Version", category: "Jersey", price: "", description: "", image: "", sizes: ["S", "M", "L", "XL"], isBestSeller: false, isFeatured: false, isNew: false };

export function ProductManager({ initialProducts }: { initialProducts: NormalizedJersey[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState<ProductInput>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const filtered = products.filter((p) => `${p.name} ${p.team} ${p.league}`.toLowerCase().includes(query.toLowerCase()));
  const update = (key: keyof ProductInput, value: string | boolean | string[]) => setForm((prev) => ({ ...prev, [key]: value }));

  async function save() {
    const result = editing ? await updateProductAction(editing, form) : await createProductAction(form);
    setMessage(result.success ? "Product saved" : result.error || "Save failed");
    if (result.success) window.location.reload();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this product?")) return;
    const result = await deleteProductAction(id);
    setMessage(result.success ? "Product deleted" : result.error || "Delete failed");
    if (result.success) setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return <div className="space-y-6 text-[#0C0A09]">
    <header className="border-b border-[#E5E5E5] pb-4"><p className="text-xs font-bold uppercase tracking-wider text-[#57534E]">Catalog management</p><h1 className="text-3xl font-black font-display">Products</h1></header>
    {message && <p role="status" className="rounded-lg bg-[#FAFAF9] p-3 text-sm">{message}</p>}
    <section className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-4">
      <h2 className="text-lg font-bold">{editing ? "Edit product" : "Add product"}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {([['name','Product name'],['team','Team'],['season','Season'],['price','Price'],['image','Image URL'],['description','Description']] as const).map(([key, label]) => <Input key={key} aria-label={label} placeholder={label} value={form[key] as string} onChange={(e) => update(key, e.target.value)} />)}
        <Select aria-label="League" value={form.league} onValueChange={(v) => update("league", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Premier League">Premier League</SelectItem><SelectItem value="La Liga">La Liga</SelectItem><SelectItem value="World Cup">World Cup</SelectItem><SelectItem value="Retro Classic">Retro Classic</SelectItem></SelectContent></Select>
        <Select aria-label="Type" value={form.type} onValueChange={(v) => update("type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Player Issue">Player Issue</SelectItem><SelectItem value="Fans Version">Fans Version</SelectItem><SelectItem value="Retro">Retro</SelectItem><SelectItem value="Kids">Kids</SelectItem></SelectContent></Select>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {([["isBestSeller", "Best seller"], ["isFeatured", "Featured"], ["isNew", "New arrival"]] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 font-medium">
            <Checkbox checked={form[key] as boolean} onCheckedChange={(c) => update(key, c === true)} /> {label}
          </label>
        ))}
      </div>
      <div className="flex gap-2"><Button className="h-auto px-5 py-2 text-xs uppercase tracking-wider font-bold" onClick={save}>Save product</Button>{editing && <Button variant="outline" className="h-auto px-5 py-2 text-xs uppercase tracking-wider font-bold" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</Button>}</div>
    </section>
    <Input aria-label="Search products" className="text-sm" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
    <div className="overflow-x-auto rounded-xl border border-[#E5E5E5] bg-white">
        <Table>
          <TableHeader className="bg-[#FAFAF9]">
            <TableRow className="hover:bg-transparent border-[#E5E5E5]">
              <TableHead>Product</TableHead>
              <TableHead>League</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="border-[#E5E5E5]">
                <TableCell className="font-semibold">{p.name}</TableCell>
                <TableCell>{p.league}</TableCell>
                <TableCell>RM {p.price}</TableCell>
                <TableCell className="text-right space-x-2">
                  <button className="underline" onClick={() => { setEditing(p.id); setForm({ ...empty, name: p.name, team: p.team, league: p.league, season: p.season, type: p.type, price: p.price, description: p.description || "", image: p.image || "", sizes: p.sizes, isBestSeller: p.isBestSeller, isFeatured: p.isFeatured, isNew: p.isNew ?? false }); }}>Edit</button>
                  <button className="text-[#DC2626] underline" onClick={() => remove(p.id)}>Delete</button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  </div>;
}
