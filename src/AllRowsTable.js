import DataGrid from 'react-data-grid';
import { useState, useMemo, createContext, useContext } from 'react';

export default function AllRowsTable({rows, xColName, yColName}) {
    const FilterContext = createContext(undefined);
    const [filters, setFilters] = useState({city: ""})
    const initialSort = [{ columnKey: 'zipcode', direction: 'ASC' }];
    const [sortColumns, setSortColumns] = useState(initialSort)

    const columns = useMemo(() => {
      return(
        [
          {key: "zipcode", name: "Zipcode"},
          {
            key: "city",
            name: "City",
            cellClass: "textFormatter",
            sortable: false,
            renderHeaderCell: ({ column }) => (
              <FilterHeader
                name="City"
                value="city"
              />
            )
          },
          {key: "x", name: xColName, cellClass: "numberFormatter"},
          {key: "y", name: yColName, cellClass: "numberFormatter"},
          {key: "pop", name: "Total Population", cellClass: "numberFormatter"}
        ]
      )
    },[xColName, yColName, filters])

    function FilterHeader(props) {
        const filters = useContext(FilterContext) ?? {city: ""};
        return(
          <>
            {props.name}&nbsp;
            <div style={{display: "inline-block"}} onClick={e => e.stopPropagation()}>
              <input
                type="text"
                value={filters[props.value]}
                onChange={e => {
                  var newFilters = {...filters}
                  newFilters[props.value] = e.target.value
                  setFilters(newFilters);
                }}
                ref={input => input && input.focus()}
                style={{width: 100}}
              />
            </div>
          </>
        )
      }

    const sortedRows = useMemo(() => {
      const sortedRows = [...rows];
      sortedRows.sort((a,b) => {
        for (const sort of sortColumns) {
          const compResult = a[sort.columnKey] - b[sort.columnKey];
          if (compResult !== 0) {
            return sort.direction === "ASC" ? compResult : -compResult;
          }
        }
        return 0;
      });
      return sortedRows;
    }, [rows, sortColumns]);

    const filteredRows = useMemo(() => {
      return sortedRows.filter(row => row.city.toLowerCase().includes(filters.city.toLowerCase()))
    }, [sortedRows, filters])

    function onSortColumnsChange(newSortColumns) {
      if (newSortColumns.length === 0) {
        setSortColumns(initialSort);
      } else {
        setSortColumns(newSortColumns);
      }
    }

    if (xColName && yColName) {
      return (
        <FilterContext.Provider value={filters}>
          <DataGrid
            columns={columns}
            rows={filteredRows}
            sortColumns={sortColumns}
            onSortColumnsChange={onSortColumnsChange}
            defaultColumnOptions={{
              sortable: true,
              resizable: true
            }}
            columnAutoWidth
            style={{height: 460}}
          />
        </FilterContext.Provider>
      )
    } else {
      return "Get a plot first"
    }
  }