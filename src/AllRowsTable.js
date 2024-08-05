import DataGrid from "react-data-grid";
import { useState, useMemo } from "react";

export default function AllRowsTable({ rows, xColName, yColName }) {
  const [filters, setFilters] = useState({ city: "" });
  const initialSort = [{ columnKey: "Geographic Area Name", direction: "ASC" }];
  const [sortColumns, setSortColumns] = useState(initialSort);
  const [currentColumn, setCurrentColumn] = useState(initialSort);

  const columns = useMemo(() => {
    return [
      { key: "Geographic Area Name", name: "Zipcode" },
      {
        key: "city",
        name: "City",
        cellClass: "textFormatter",
        sortable: false,
        renderHeaderCell: ({ column }) => (
          <FilterHeader name="City" value="city" />
        ),
      },
      { key: xColName, name: xColName, cellClass: "numberFormatter" },
      { key: yColName, name: yColName, cellClass: "numberFormatter" },
      {
        key: "Total Population",
        name: "Total Population",
        cellClass: "numberFormatter",
      },
    ];
  }, [xColName, yColName, filters]);

  function FilterHeader(props) {
    return (
      <>
        {props.name}&nbsp;
        <div
          style={{ display: "inline-block" }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={filters[props.value]}
            onChange={(e) => {
              var newFilters = { ...filters };
              newFilters[props.value] = e.target.value;
              setFilters(newFilters);
              setCurrentColumn(props.value);
            }}
            autoFocus={currentColumn === props.value}
            style={{ width: 100 }}
          />
        </div>
      </>
    );
  }

  const sortedRows = useMemo(() => {
    const sortedRows = [...rows];
    sortedRows.sort((a, b) => {
      for (const sort of sortColumns) {
        const compResult =
          a[sort.columnKey] - b[sort.columnKey] ||
          isNaN(a[sort.columnKey]) - isNaN(b[sort.columnKey]);
        if (compResult !== 0) {
          if (isNaN(a[sort.columnKey]) || isNaN(b[sort.columnKey])) {
            return compResult;
          }
          return sort.direction === "ASC" ? compResult : -compResult;
        }
      }
      return 0;
    });
    return sortedRows;
  }, [rows, sortColumns]);

  const filteredRows = useMemo(() => {
    return sortedRows.filter((row) =>
      row.city.toLowerCase().includes(filters.city.toLowerCase()),
    );
  }, [sortedRows, filters]);

  function onSortColumnsChange(newSortColumns) {
    if (newSortColumns.length === 0) {
      setSortColumns(initialSort);
    } else {
      setSortColumns(newSortColumns);
    }
  }

  if (xColName && yColName) {
    return (
        <DataGrid
            columns={columns}
            rows={filteredRows}
            sortColumns={sortColumns}
            onSortColumnsChange={onSortColumnsChange}
            defaultColumnOptions={{
            sortable: true,
            resizable: true,
            }}
            columnAutoWidth
            style={{ height: 460 }}
        />
    );
  } else {
    return "Get a plot first";
  }
}
