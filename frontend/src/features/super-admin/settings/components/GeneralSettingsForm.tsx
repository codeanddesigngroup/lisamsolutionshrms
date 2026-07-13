export const GeneralSettingsForm = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
    <div className="form-group">
      <label className="mb-2 block text-[11px] font-bold uppercase text-gray-400">Company Name</label>
      <input type="text" className="form-control" defaultValue="Lisam Solutions HR" />
    </div>
    <div className="form-group">
      <label className="mb-2 block text-[11px] font-bold uppercase text-gray-400">Company Email</label>
      <input type="email" className="form-control" defaultValue="admin@lisam.com" />
    </div>
    <div className="form-group">
      <label className="mb-2 block text-[11px] font-bold uppercase text-gray-400">Company Phone</label>
      <input type="text" className="form-control" defaultValue="+1 234 567 890" />
    </div>
    <div className="form-group">
      <label className="mb-2 block text-[11px] font-bold uppercase text-gray-400">Company Website</label>
      <input type="url" className="form-control" defaultValue="https://lisam.com" />
    </div>
    <div className="col-span-full">
      <label className="mb-2 block text-[11px] font-bold uppercase text-gray-400">Company Address</label>
      <textarea className="form-control min-h-[100px] py-3" />
    </div>
  </div>
);
