type ModuleDiscoveryBadgeProps = {
  label: string;
  title?: string;
};

export default function ModuleDiscoveryBadge({ label, title }: ModuleDiscoveryBadgeProps) {
  return (
    <span className="ui-nav-discovery-badge ml-auto shrink-0" title={title}>
      {label}
    </span>
  );
}
