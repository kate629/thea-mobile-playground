import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepOccasion } from './QuizStepOccasion';

export default {
  title: 'Surfaces/Quiz/StepOccasion',
  component: QuizStepOccasion,
};

const BASE_OPTIONS = [
  { value: 'Birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'Just Because', label: 'Just Because', emoji: '🥰' },
  { value: 'Thank You', label: 'Thank You', emoji: '🙏' },
  { value: 'Housewarming', label: 'Housewarming', emoji: '🏡' },
  { value: 'New Baby', label: 'New Baby', emoji: '🍼' },
  { value: 'Wedding', label: 'Wedding', emoji: '💍' },
  { value: 'Graduation', label: 'Graduation', emoji: '🎓' },
  { value: 'Other', label: 'Other', emoji: '✨' },
];

const FEMALE_OPTIONS = [
  { value: "Mother's Day", label: "Mother's Day", emoji: '🌷' },
  ...BASE_OPTIONS,
];

const MALE_OPTIONS = [{ value: "Father's Day", label: "Father's Day", emoji: '👔' }, ...BASE_OPTIONS];

const PARTNER_OPTIONS = [...BASE_OPTIONS, { value: 'Anniversary', label: 'Anniversary', emoji: '💕' }];

const wrap = (node: React.ReactNode) => (
  <QuizCard onBack={() => {}} progressPercent={(3 / 4) * 100}>{node}</QuizCard>
);

export const Default = {
  render: () => wrap(
    <QuizStepOccasion options={BASE_OPTIONS} selected="" onSelect={() => {}} />,
  ),
};

export const BirthdaySelected = {
  render: () => wrap(
    <QuizStepOccasion options={BASE_OPTIONS} selected="Birthday" onSelect={() => {}} />,
  ),
};

export const FemaleVariant = {
  name: "Female (adds Mother's Day)",
  render: () => wrap(
    <QuizStepOccasion options={FEMALE_OPTIONS} selected="" onSelect={() => {}} />,
  ),
};

export const MaleVariant = {
  name: "Male (adds Father's Day)",
  render: () => wrap(
    <QuizStepOccasion options={MALE_OPTIONS} selected="" onSelect={() => {}} />,
  ),
};

export const PartnerVariant = {
  name: 'Partner (adds Anniversary)',
  render: () => wrap(
    <QuizStepOccasion options={PARTNER_OPTIONS} selected="Anniversary" onSelect={() => {}} />,
  ),
};

export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => wrap(
    <QuizStepOccasion options={BASE_OPTIONS} selected="" onSelect={() => {}} />,
  ),
};
