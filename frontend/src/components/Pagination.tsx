import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="pagination-controls">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="pagination-button"
        aria-label="Previous Page"
      >
        <FiChevronLeft size="1.25rem" />
      </button>
      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="pagination-button"
        aria-label="Next Page"
      >
        <FiChevronRight size="1.25rem" />
      </button>
    </div>
  );
};

export default PaginationControls;
