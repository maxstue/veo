function HomeLayout({ children }: { children: React.ReactNode }) {
  return <main className='home-shell min-h-screen overflow-hidden'>{children}</main>;
}

export { HomeLayout };
