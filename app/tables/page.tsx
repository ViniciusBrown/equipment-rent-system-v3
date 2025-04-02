import { listTables } from "@/app/actions"

export default async function TablesPage() {
  const { tables, error } = await listTables()

  if (error) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Database Tables</h1>
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Database Tables</h1>
      <div className="grid gap-4">
        {tables?.map((table: { table_name: string }) => (
          <div key={table.table_name} className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">{table.table_name}</h2>
          </div>
        ))}
      </div>
    </div>
  )
}