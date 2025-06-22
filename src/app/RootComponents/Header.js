"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

    return (
    <nav className="relative flex items-center bg-white text-black h-[100px] px-4 border-b border-gray-300">
      {/* Logo at left, vertically centered */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <Image
          src="/logo.png"
          alt="Itinera logo"
          width={140}
          height={140}
          className="object-contain"
        />
      </div>

      {/* Centered navigation links */}
      <div className="mx-auto flex space-x-100 text-xl font-medium">
        <Link href="/">Home</Link>
        <Link href="/map">Map</Link>
      </div>
        </nav>
    );
}