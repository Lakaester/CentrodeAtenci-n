import { Outlet } from "react-router-dom";
import { Tabs } from "@/components/layout/Tabs";
import { FilterBar } from "@/components/filters/FilterBar";

export function ReportLayout() {
  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-wrap gap-3 items-end px-5 pt-3 pb-2 md:px-6">
        <h1 className="text-base font-semibold text-black-85">Reportes</h1>
      </div>
      <Tabs />
      <FilterBar />
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
        <Outlet />
      </div>
    </div>
  );
}
