import RideCardSkeleton from '@/components/rides/RideCardSkeleton';

export default function SearchSkeleton() {
  return (
    <div className="mt-4 w-full animate-fade-in-up">
      <RideCardSkeleton count={3} />
    </div>
  );
}
