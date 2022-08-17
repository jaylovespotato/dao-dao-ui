import { ComponentMeta, ComponentStory } from '@storybook/react'

import { RadioButton } from 'components/input/RadioInput'

export default {
  title: 'DAO DAO UI / input / RadioButton',
  component: RadioButton,
} as ComponentMeta<typeof RadioButton>

const Template: ComponentStory<typeof RadioButton> = (args) => <RadioButton {...args} />

export const Default = Template.bind({})
Default.args = {
  "selected": null // TODO: Fill in default value.
}
