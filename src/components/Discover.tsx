import DiscoverCard from "@/components/subcomponents/DiscoverCard";
import teamphoto from "@/assets/img/stock/teamphoto.jpeg";
import joinourteam from "@/assets/img/stock/joinourteam.jpeg";
import showcase from "@/assets/img/stock/showcase.jpeg";
import events from "@/assets/img/stock/events.jpeg";
import { BetweenHorizonalStart, Contact, HandCoins, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Discover() {
  const discoverCards = [
    {
      title: "More About Us",
      icon: Info,
      description: "What makes us different",
      image: teamphoto,
      link: "/about",
      isOpen: true,
    },
    {
      title: "Contact Us",
      icon: Contact,
      description: "Get in touch",
      image: showcase,
      link: "/contacts",
      isOpen: true,
    },
    {
      title: "Positions",
      icon: BetweenHorizonalStart,
      description: "Find what position fits you",
      image: joinourteam,
      link: "/positions",
      isOpen: true,
    },
    {
      title: "Sponsors",
      icon: HandCoins,
      description: "People who believe in us",
      image: events,
      link: "/sponsors",
      isOpen: true,
    },
  ];

  return (
    <Card className="text-center py-10 bg-primary rounded-none border-none">
      <CardHeader>
        <CardTitle className="text-primary-foreground">
          <div className="text-3xl md:text-6xl font-bold">Discover More</div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex justify-center gap-6 flex-wrap mx-5">
        {/* Cards Container */}
        {discoverCards.map((card, index) => (
          <DiscoverCard
            key={`${card.title}-${index}`}
            title={card.title}
            icon={card.icon}
            description={card.description}
            image={card.image}
            link={card.link}
            isOpen={card.isOpen}
            className="w-full md:w-full lg:w-1/3 aspect-video"
          />
        ))}
      </CardContent>
    </Card>
  );
}
