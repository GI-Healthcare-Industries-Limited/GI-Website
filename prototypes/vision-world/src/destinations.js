// This prototype describes GI Healthcare's vision, not certified deployments.
export const categories = [
  { id: "all", label: "The whole world" },
  { id: "everyday", label: "Everyday life" },
  { id: "transport", label: "On the move" },
  { id: "extreme", label: "Extreme environments" },
  { id: "space", label: "Beyond Earth" },
];

export const destinations = [
  {
    id: "school",
    name: "Schools",
    category: "everyday",
    position: [-7, 2.8, 3],
    icon: "school",
    featured: true,
    number: "01",
    title: "Good food.\nBright futures.",
    subtitle: "Autonomous cooking for school communities.",
    description:
      "Imagine freshly cooked lunches that fit the rhythm of the school day. Our vision is to help catering teams serve nourishing meals, with less repetitive kitchen work.",
    detail:
      "A compact cooking system could support busy school kitchens, giving people more time to focus on children and their food.",
    tags: ["School catering", "Fresh meals", "Kitchen support"],
    scale: 1,
    distance: 8,
  },
  {
    id: "university",
    name: "Universities",
    category: "everyday",
    position: [-5.4, 3.2, -2.7],
    icon: "school",
    title: "Food for\ncurious minds.",
    subtitle: "From campus cafés to student residences.",
    description:
      "Freshly cooked food should fit around learning, not the other way around. We see autonomous cooking supporting campus catering across different locations and timetables.",
    tags: ["Campus life", "Flexible service"],
    distance: 9,
  },
  {
    id: "hospital",
    name: "Hospitals",
    category: "everyday",
    position: [3.8, 3.9, -2.5],
    icon: "hospital",
    title: "Care starts\nwith good food.",
    subtitle: "Supporting the people behind healthcare.",
    description:
      "Hospital life continues around the clock. Our vision includes freshly cooked meals for staff and visitors, supported by catering teams and each hospital’s food-safety and dietary requirements.",
    tags: ["Staff catering", "Shift work"],
    distance: 10,
  },
  {
    id: "office",
    name: "Workplaces",
    category: "everyday",
    position: [-5.3, 7.3, -7.1],
    icon: "building",
    title: "A better\nworking lunch.",
    subtitle: "Fresh food where people work.",
    description:
      "We envision convenient, freshly cooked meals within workplaces—from shared office kitchens to large business campuses—reducing the distance between a busy day and a good lunch.",
    tags: ["Workplace dining", "Everyday convenience"],
    distance: 12,
  },
  {
    id: "festival",
    name: "Festivals",
    category: "everyday",
    position: [3, 3.4, 5.1],
    icon: "music",
    title: "Big moments.\nBetter meals.",
    subtitle: "Cooking for crowds, beyond the usual kitchen.",
    description:
      "Festivals bring people together in places without permanent catering infrastructure. Modular autonomous cooking could help teams prepare fresh meals close to the action.",
    tags: ["Events", "Temporary kitchens"],
    distance: 10,
  },
  {
    id: "home",
    name: "Homes",
    category: "everyday",
    position: [-6.8, 2.8, 7.5],
    icon: "home",
    title: "More time\nfor living.",
    subtitle: "Everyday cooking, reimagined.",
    description:
      "The long-term vision reaches home: a helpful cooking system that makes freshly prepared meals easier to fit into daily life, while keeping choice with the people eating them.",
    tags: ["Everyday life", "Convenience"],
    distance: 8,
  },
  {
    id: "train",
    name: "Rail travel",
    category: "transport",
    position: [-2.6, 1.8, 10.6],
    icon: "train",
    title: "Fresh food.\nMoving with you.",
    subtitle: "An ambition for the journey, not just the destination.",
    description:
      "Rail travel offers an opportunity to rethink onboard catering. Compact cooking systems could support fresh meal preparation within the practical constraints of a moving train.",
    tags: ["Onboard catering", "Compact kitchens"],
    distance: 10,
  },
  {
    id: "plane",
    name: "Aviation",
    category: "transport",
    position: [-14, 8.8, -4.7],
    icon: "plane",
    title: "A fresh\nperspective.",
    subtitle: "Exploring the future of food in flight.",
    description:
      "Our vision extends to aviation: exploring how autonomous cooking could work within the space, power and safety constraints of aircraft. Aviation use would need dedicated development and approvals.",
    tags: ["Future research", "Onboard food"],
    distance: 10,
  },
  {
    id: "container",
    name: "Container ships",
    category: "transport",
    position: [-16, 1.3, -0.8],
    icon: "ship",
    title: "Across oceans.\nAround the table.",
    subtitle: "Fresh meals for life at sea.",
    description:
      "Long voyages make reliable onboard catering important. We see an opportunity to support shipboard cooks with autonomous meal preparation designed around life and logistics at sea.",
    tags: ["Merchant shipping", "Crew catering"],
    distance: 10,
  },
  {
    id: "submarine",
    name: "Submarines",
    category: "transport",
    position: [-5, 0.7, 15],
    icon: "waves",
    title: "Good food,\nbelow the surface.",
    subtitle: "A vision for demanding, enclosed environments.",
    description:
      "Space, resources and reliability matter deeply underwater. Submarine catering is a potential application for compact autonomous cooking, subject to specialised engineering and operational validation.",
    tags: ["Enclosed environments", "Future development"],
    distance: 9,
  },
  {
    id: "navy",
    name: "Naval vessels",
    category: "transport",
    position: [5, 1.6, 14.7],
    icon: "ship",
    title: "Fuelling life\nat sea.",
    subtitle: "Supporting crews on demanding missions.",
    description:
      "Our vision includes helping naval catering teams provide freshly cooked meals during extended operations, with systems developed around the particular demands of maritime service.",
    tags: ["Maritime operations", "Crew support"],
    distance: 11,
  },
  {
    id: "oil-rig",
    name: "Offshore platforms",
    category: "extreme",
    position: [16, 4.8, 4.6],
    icon: "rig",
    featured: true,
    number: "02",
    title: "Far from shore.\nClose to home.",
    subtitle: "Freshly cooked meals for offshore teams.",
    description:
      "For people working offshore, a good meal is more than a break. Our vision is to support reliable fresh-food preparation where space, staffing and supply chains are tightly constrained.",
    detail:
      "Explore a conceptual offshore galley: our cooking system alongside a compact preparation area and a shared place to eat.",
    tags: ["Remote teams", "Offshore catering", "Compact footprint"],
    distance: 13,
  },
  {
    id: "antarctic",
    name: "Antarctic research",
    category: "extreme",
    position: [-13.5, 3.4, -12.5],
    icon: "snow",
    title: "Warm meals.\nCold frontiers.",
    subtitle: "Supporting research in the most remote places.",
    description:
      "Polar teams work far from everyday supply networks. We envision cooking technology that helps researchers prepare nourishing meals around the constraints of remote stations.",
    tags: ["Polar research", "Remote living"],
    distance: 12,
  },
  {
    id: "deep-sea",
    name: "Deep-sea research",
    category: "extreme",
    position: [-15, -0.2, 10],
    icon: "waves",
    title: "New depths.\nFamiliar comforts.",
    subtitle: "An ambition for underwater habitats.",
    description:
      "Future underwater research habitats could need new approaches to everyday food preparation. This is a long-term exploration of compact cooking in highly controlled environments.",
    tags: ["Research habitats", "Future exploration"],
    distance: 11,
  },
  {
    id: "industry",
    name: "Industry & energy",
    category: "extreme",
    position: [7.7, 5.3, -6.7],
    icon: "industry",
    title: "Powering\nthe people.",
    subtitle: "Fresh meals for large industrial teams.",
    description:
      "Industrial and energy sites rely on people working across long shifts. We see autonomous cooking supporting staff catering, separate from safety-critical plant operations.",
    tags: ["Industrial catering", "Shift teams"],
    distance: 12,
  },
  {
    id: "military",
    name: "Military operations",
    category: "extreme",
    position: [7.7, 2.7, 3.4],
    icon: "shield",
    title: "Ready for\nthe field.",
    subtitle: "Cooking technology for demanding deployments.",
    description:
      "A central part of our vision is freshly cooked food for teams operating in challenging environments. We are exploring modular autonomous cooking to support field catering and reduce repetitive preparation work.",
    tags: ["Field catering", "Modular systems"],
    distance: 10,
  },
  {
    id: "relief",
    name: "Disaster relief",
    category: "extreme",
    position: [0.8, 3.8, -7.8],
    icon: "relief",
    title: "When it matters\nmost.",
    subtitle: "A warm meal when life is disrupted.",
    description:
      "Disasters can interrupt access to kitchens and freshly prepared food. Deployable cooking systems could support relief teams serving responders and affected communities.",
    tags: ["Emergency response", "Deployable kitchens"],
    distance: 10,
  },
  {
    id: "camping",
    name: "Outdoor living",
    category: "extreme",
    position: [-10, 2.5, -3.9],
    icon: "tent",
    title: "Go further.\nEat well.",
    subtitle: "Cooking beyond the everyday kitchen.",
    description:
      "From remote camps to outdoor expeditions, we imagine practical ways to prepare fresh meals away from conventional kitchens, with systems suited to their operating environment.",
    tags: ["Remote camps", "Outdoor life"],
    distance: 9,
  },
  {
    id: "station",
    name: "Space stations",
    category: "space",
    position: [2.6, 13.5, -12],
    icon: "station",
    featured: true,
    number: "03",
    title: "A taste\nof home.",
    subtitle: "Fresh food, even beyond Earth.",
    description:
      "Our long-term ambition reaches orbit: exploring what autonomous cooking could mean for people living and working in space, where gravity, resources and safety reshape every part of the kitchen.",
    detail:
      "This conceptual habitat shows the vision—not flight-qualified hardware. Space applications require dedicated research, testing and certification.",
    tags: ["Microgravity research", "Life in orbit", "Long-term vision"],
    distance: 13,
  },
  {
    id: "moon",
    name: "The Moon",
    category: "space",
    position: [-7.5, 12.5, -16],
    icon: "moon",
    title: "The next\nplace to eat.",
    subtitle: "Imagining everyday life on the Moon.",
    description:
      "As people explore sustained lunar living, food preparation becomes part of the challenge. We envision research into cooking systems suited to reduced gravity and constrained resources.",
    tags: ["Lunar living", "Research vision"],
    distance: 9,
  },
  {
    id: "mars",
    name: "Mars",
    category: "space",
    position: [11, 16.5, -15],
    icon: "planet",
    title: "A world\nof possibility.",
    subtitle: "Our most distant ambition.",
    description:
      "A future on Mars would demand new ways to prepare food far from Earth. It is a long-term horizon for our vision of freshly cooked meals, wherever life takes us.",
    tags: ["Future habitats", "Long-term vision"],
    distance: 9,
  },
];

export function getDestination(id) {
  return destinations.find((item) => item.id === id) ?? null;
}
export function inCategory(id) {
  return id === "all"
    ? destinations
    : destinations.filter((item) => item.category === id);
}
export function validCategory(id) {
  return categories.some((item) => item.id === id) ? id : "all";
}
export const featured = destinations.filter((item) => item.featured);
