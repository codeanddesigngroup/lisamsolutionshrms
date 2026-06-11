import type { RecentCompany } from "../types";

type RecentCompaniesTableProps = {
  companies: RecentCompany[];
};

export const RecentCompaniesTable = ({ companies }: RecentCompaniesTableProps) => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
    <div className="white-box">
      <h4 className="box-title mb-6">Recent Company / Branch Records</h4>
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th className="w-16 text-center">#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th className="text-center">Date</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <tr key={company.id}>
                <td className="text-center">{index + 1}</td>
                <td>{company.name}</td>
                <td>{company.email}</td>
                <td>
                  <span className={`label ${company.status === "Active" ? "label-success" : "label-warning"}`}>{company.status}</span>
                </td>
                <td className="text-center">{new Date(company.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
