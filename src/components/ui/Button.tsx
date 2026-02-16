type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

export default function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-sm hover:bg-white/10 hover:border-white/15 active:scale-[0.99] transition cursor-pointer"
    >
      {children}
    </button>
  );
}
