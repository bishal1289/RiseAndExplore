import { Link } from 'react-router-dom';
import { CalendarPlus, Upload, Star, Smartphone, Home, Languages, Trash2 } from 'lucide-react';
import { Card, PageTitle } from '../components/ui';

const sections = [
  {
    icon: CalendarPlus,
    title: 'Add an event',
    steps: [
      <>Go to <Link to="/admin/events/new" className="font-semibold text-primary">Events → New event</Link>.</>,
      'Step 1: type the title, date, time and place. The Google Maps link is made for you.',
      'Step 2: write a short summary (for cards) and the full description. Use the English / Español tabs to add Spanish.',
      'Step 3: choose a cover photo.',
      'Steps 4 & 5: add photos and videos. Drag photos to change their order.',
      'Step 6: choose “Published” and press Save. Use “Preview” first if you want to check it.',
    ],
  },
  {
    icon: Upload,
    title: 'Upload photos and videos',
    steps: [
      <>Open the <Link to="/admin/media" className="font-semibold text-primary">Media Library</Link> and press Upload.</>,
      'Drag files into the box, or tap it to pick from your phone. You can add up to 50 at once.',
      'Photos are made smaller automatically, so uploads are fast. iPhone HEIC photos are converted for you.',
      'Big videos upload in pieces — keep the page open until the bar is full. Videos show “Processing…” for a few minutes afterwards.',
      'Tap any photo to add a caption and alt text (a short description for people who can’t see the image). Alt text is required.',
      'You can also paste a YouTube or Vimeo link instead of uploading a video.',
    ],
  },
  {
    icon: Smartphone,
    title: 'Uploading straight from an event',
    steps: [
      'Sign in on your phone, open the event, and tap “Add photos” → “Upload new”.',
      'Choose photos from your camera roll, or take a new one. They’re added to that event automatically.',
      'Remember to press Save at the bottom of the event.',
    ],
  },
  {
    icon: Star,
    title: 'Feature an event on the homepage',
    steps: [
      'Open the event and go to step 6 (Visibility).',
      'Turn on “Feature on homepage” and Save.',
      'The homepage shows 2 featured events in “This summer”. If you feature a third, the one featured the longest is removed and you’ll see a notice.',
    ],
  },
  {
    icon: Home,
    title: 'Change the homepage',
    steps: [
      <>Open <Link to="/admin/homepage" className="font-semibold text-primary">Homepage</Link>. Each section has its own box.</>,
      'Drag sections to reorder them, or hide one with the eye button.',
      'Press “Preview changes” to see the page before saving.',
      <>Pick the 4 “Community in action” photos in <Link to="/admin/gallery" className="font-semibold text-primary">Gallery → Homepage row</Link>.</>,
    ],
  },
  {
    icon: Languages,
    title: 'English and Spanish',
    steps: [
      'Every text box has English and Español tabs. A small yellow dot means the Spanish is still missing.',
      'If Spanish is empty, visitors who chose Spanish see the English text instead.',
    ],
  },
  {
    icon: Trash2,
    title: 'Deleting and restoring',
    steps: [
      'Deleted items go to the Trash for 30 days.',
      <>To bring something back, open the <Link to="/admin/trash" className="font-semibold text-primary">Trash</Link> and press Restore.</>,
    ],
  },
];

export default function Guide() {
  return (
    <>
      <PageTitle title="Admin guide" intro="Quick help for the most common tasks." />
      <div className="grid gap-5 md:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title}>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-card text-primary">
                <s.icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="font-serif text-xl">{s.title}</h2>
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-ink marker:font-bold marker:text-primary">
              {s.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </>
  );
}
