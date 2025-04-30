
import React from 'react';

const EmptyServiceState = () => {
  return (
    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
      <h3 className="text-lg font-medium mb-2">No services added yet</h3>
      <p className="text-muted-foreground mb-6">
        Add your first service by clicking the button above.
      </p>
    </div>
  );
};

export default EmptyServiceState;
