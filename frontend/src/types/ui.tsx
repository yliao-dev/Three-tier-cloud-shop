export type SelectOption = {
  value: string;
  label: string;
};

export type FilterProps = {
  placeholder: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  isLoading?: boolean;
};
