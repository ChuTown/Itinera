import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-white text-black min-h-screen px-10 pt-6 pb-20 grid grid-rows-[auto_1fr_auto] items-start justify-items-start font-[family-name:var(--font-geist-sans)]">
      <div>
        <h1 className="text-6xl font-bold leading-tight">Welcome to Itinera!</h1>
        <h2 className="text-3xl mt-2 ml-1">Plan Less, Experience More</h2>
      </div>
      <div className="absolute -left-15 top-75 transform -translate-y-[50%]">
              <Image
                src="/plane.png"
                alt="Plane break"
                width={500}
                height={500}
                className="object-contain"
              />
      </div>

      <div>
        <h1 className="text-3xl font-bold leading-tight mt-40">What do we do?</h1>
        <div className="min-h-screen flex items-start justify-start px-1 pt-7">
  <p className="text-xl max-w-xl">
  Intinera is a smart travel planner that recommends personalized places to visit and builds the most efficient 
  itinerary based on your interests. It helps travelers spend less time planning by suggesting where to go, what aligns with their 
  preferences, and how to organize their stops efficiently. </p>
</div>
<div className="absolute right-25 top-95 transform -translate-y-[50%]">
              <Image
                src="/travel.jpg"
                alt="Travel break"
                width={600}
                height={600}
                className="rounded-3xl object-contain"
              />
      </div>
      </div>

      <div className="w-full h-100 flex flex-col -mt-140 bg-[rgba(123,183,237,.4)] px-10 py-6">
  <div className="w-full flex justify-center">
    <p className="text-black text-5xl font-semibold">ITINERA'S SOLUTION</p>
  </div>
  <div className="w-full flex justify-center">
  <p className="mt-6 max-w-xl text-2xl text-left">A travel planner that plans:</p>
  </div>
  <div className="w-full flex justify-center">
  <ul className="list-disc ml-20 text-2xl mt-4">
    <li>The most optimal route when visiting more than 1 city</li>
    <li>Allows you to customize your itinerary based on your interests and optimizes the best route to visit all destinations within the city</li>
  </ul>
  </div>
</div>


    </div>
  );
}
