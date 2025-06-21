"use client";

import React from "react";
import Link from "next/link"
import {useRouter} from "next/navigation"

export default function Header() {
  const router = useRouter();
    return (
        <nav className="flex justify-around items-center bg-black h-13 text-white">
          <Link href = '/'>Home</Link>
          <Link href = '/about'>About</Link>
          <Link href = '/contact'>Contact</Link>
        </nav>
    );
}