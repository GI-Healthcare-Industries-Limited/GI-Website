const principles = (topic, context) => ({ href: '/research#principles', topic, context });
const space = (context) => ({ href: '/research#future-title', topic: 'cooking beyond Earth', context });

// Link the vision to the relevant research, without claiming validated deployments.
export const destinationResearch = {
  school: principles('resource-conscious cooking', 'for school kitchens'),
  university: principles('efficient, modular cooking systems', 'for campus life'),
  hospital: principles('resource efficiency and serviceable design', 'for hospital kitchens'),
  office: principles('compact, efficient cooking', 'for workplace kitchens'),
  festival: principles('portable, resource-conscious cooking', 'for large events'),
  home: principles('compact, long-lasting design', 'for everyday kitchens'),
  train: principles('compact cooking systems', 'for limited space on board'),
  plane: principles('lightweight, resource-efficient design', 'for aviation settings'),
  container: principles('modular, long-lasting cooking systems', 'for life at sea'),
  submarine: principles('space and resource efficiency', 'for confined environments'),
  navy: principles('compact, serviceable cooking systems', 'for extended voyages'),
  'oil-rig': principles('durable, modular design', 'for remote offshore kitchens'),
  antarctic: principles('resource-efficient, long-lasting systems', 'for remote research stations'),
  'deep-sea': principles('compact systems that conserve resources', 'for isolated research habitats'),
  industry: principles('efficient, maintainable cooking systems', 'for industrial workplaces'),
  military: principles('compact, transportable cooking systems', 'for demanding field environments'),
  relief: principles('portable systems that use fewer resources', 'for disaster-relief settings'),
  camping: principles('compact, resource-conscious design', 'for life off the beaten track'),
  station: space('for future space-station kitchens'),
  moon: space('for future lunar habitats'),
  mars: space('for future Mars habitats'),
};
