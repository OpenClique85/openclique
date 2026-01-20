interface BranchLabelProps {
  label: string;
  colorTheme: {
    primary: string;
  };
}

const BranchLabel = ({ label, colorTheme }: BranchLabelProps) => {
  return (
    <div 
      className="px-2 py-0.5 rounded-full text-[9px] font-medium italic whitespace-nowrap"
      style={{
        backgroundColor: `${colorTheme.primary}15`,
        color: colorTheme.primary,
        border: `1px solid ${colorTheme.primary}30`,
      }}
    >
      {label}
    </div>
  );
};

export default BranchLabel;
