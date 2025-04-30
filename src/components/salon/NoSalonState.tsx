
import React from 'react';

const NoSalonState = () => {
  return (
    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
      <h3 className="text-lg font-medium mb-2">No salon found</h3>
      <p className="text-muted-foreground mb-6">
        Please create a salon before adding services.
      </p>
    </div>
  );
};

export default NoSalonState;
