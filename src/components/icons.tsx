export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
      <path d="M12 21v-3" />
      <path d="M17 21v-5" />
      <path d="M7 21v-7" />
      <path d="M19 3l-1.414 1.414" />
      <path d="M21 5l-1.414-1.414" />
      <path d="M17 5l1.414-1.414" />
    </svg>
  );
}
