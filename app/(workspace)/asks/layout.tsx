import AsksSectionNav from "../../../components/v2/asks/AsksSectionNav";

export default function AsksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <AsksSectionNav />
      {children}
    </div>
  );
}
