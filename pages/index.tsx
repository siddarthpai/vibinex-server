import React from 'react'
import Footer from '../components/Footer'
import Navbar from '../views/Navbar'
import Hero from '../views/Hero'
import WhyUs from '../views/WhyUs'
import { rudderEventMethods } from "../utils/rudderstack_initialize";
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  React.useEffect(() => {
    const localStorageAnonymousId = localStorage.getItem('AnonymousId');
    const anonymousId: string = (localStorageAnonymousId && localStorageAnonymousId != null) ? localStorageAnonymousId : uuidv4();

    rudderEventMethods().then((response) => {
      response?.identify("", "", "", anonymousId);
    });
    localStorage.setItem('AnonymousId', anonymousId);
  }, []);

  return (
    <div>
      <Navbar />
      <Hero />
      <WhyUs />
      <Footer />
    </div>
  )
}