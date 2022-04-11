import React from 'react'
import PlanningTool from '../components/PlanningTool'

export default {
  component: PlanningTool,
  title: 'Planning tool',
  parameters: {
    actions: {
      handles: ['click .rct-item'],
    },
  },
}

const Template = (args) => <PlanningTool {...args} />

export const planningTool = Template.bind({});
planningTool.args = {
  data: require('./../data3.json'),
}