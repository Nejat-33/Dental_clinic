import { Container } from '@/components/ui/container';
import { ButtonLink } from '@/components/ui/button-link';

export function CtaBanner() {
  return (
    <section className="py-20">
      <Container>
        <div className="rounded-3xl bg-brand-700 px-8 py-14 text-center text-white sm:px-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready for a healthier smile?</h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
            Book your visit online and we&apos;ll confirm your appointment shortly.
          </p>
          <ButtonLink href="/appointment" variant="light" size="lg" className="mt-8">
            Book an appointment
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}