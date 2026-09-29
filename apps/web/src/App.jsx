import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import Layout from '@/components/Layout';
import PublicHome from '@/public/PublicHome';
import PublicCard from '@/public/components/PublicCard';
import PublicContact from '@/public/components/PublicContact';
import NotFound from '@/pages/NotFound';
import KonamiEasterEgg from '@/components/KonamiEasterEgg';
import { NotesArticle, NotesIndex } from '@/notes/NotesPages';

function App({ snapshot }) {
  const location = useLocation();
  const navigationType = useNavigationType();

  return (
    <>
      <KonamiEasterEgg />
      {/* The layout and its header persist across pathnames; route motion is
          handled by TransitionRouter rather than by remounting the tree. */}
      <Routes location={location}>
        <Route
          path="/"
          element={<Layout navigationType={navigationType} routeLocation={location} snapshot={snapshot} />}
        >
          <Route index element={<PublicHome snapshot={snapshot} />} />
          <Route path="card" element={<PublicCard snapshot={snapshot} />} />
          <Route path="contact" element={<PublicContact contact={snapshot.content.contact} />} />
          <Route path="notes" element={<NotesIndex />} />
          <Route path="notes/:slug" element={<NotesArticle />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
