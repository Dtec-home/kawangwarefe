'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { driver } from 'driver.js';
import type { Config, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

interface TourStep {
  element?: string | Element | (() => Element);
  popover: {
    title: string;
    description: string;
    side?: 'left' | 'right' | 'top' | 'bottom';
    align?: 'start' | 'center' | 'end';
  };
}

interface UseTourOptions {
  tourKey: string;
  steps: (TourStep | DriveStep)[];
  autoStart?: boolean;
  allowReset?: boolean;
}

interface TutorialStateQuery {
  isTutorialCompleted: boolean;
}

const GET_TUTORIAL_STATE = gql`
  query GetTutorialState($tutorialKey: String!) {
    isTutorialCompleted(tutorialKey: $tutorialKey)
  }
`;

const UPDATE_TUTORIAL_STATUS = gql`
  mutation UpdateTutorialStatus($tutorialKey: String!, $completed: Boolean!) {
    updateTutorialStatus(tutorialKey: $tutorialKey, completed: $completed) {
      success
      message
    }
  }
`;

export function useTour({
  tourKey,
  steps,
  autoStart = true,
  allowReset = false,
}: UseTourOptions) {
  const driverRef = useRef<Driver | null>(null);
  const [isReady, setIsReady] = useState(false);
  const initializingRef = useRef(false);

  // Check if tutorial has been completed
  const { data, loading } = useQuery<TutorialStateQuery>(GET_TUTORIAL_STATE, {
    variables: { tutorialKey: tourKey },
    skip: !tourKey,
  });

  const [markComplete] = useMutation(UPDATE_TUTORIAL_STATUS);

  // Initialize driver.js
  useEffect(() => {
    if (loading || !tourKey || !steps.length || initializingRef.current) return;

    const isCompleted = data?.isTutorialCompleted ?? false;

    // Convert steps to driver.js format (filter out invalid steps)
    const driverSteps: Config['steps'] = steps
      .filter((step) => step && step.popover)
      .map((step) => ({
        element: step.element,
        popover: {
          title: step.popover!.title,
          description: step.popover!.description,
          side: step.popover!.side || 'left',
          align: step.popover!.align || 'center',
        },
      }));

    // Initialize driver instance with Tailwind-friendly styling
    const driverConfig: Config = {
      showProgress: true,
      allowClose: true,
      overlayOpacity: 0.5,
      stagePadding: 10,
      steps: driverSteps,
      onDestroyStarted: () => {
        // driver.js v1: overriding this hook means we own the close —
        // must call destroy() explicitly or the popover stays on screen.
        markComplete({
          variables: {
            tutorialKey: tourKey,
            completed: true,
          },
        }).catch((error) => {
          console.warn(`Failed to mark tutorial '${tourKey}' as complete:`, error);
        });
        driverRef.current?.destroy();
      },
    };

    initializingRef.current = true;

    try {
      const instance = driver(driverConfig);
      driverRef.current = instance;

      // Batch state update after initialization
      queueMicrotask(() => setIsReady(true));

      // Only auto-start if not previously completed
      if (autoStart && !isCompleted) {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          instance.drive();
        }, 100);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error(`Failed to initialize tour '${tourKey}':`, error);
      initializingRef.current = false;
    }

    return () => {
      try {
        driverRef.current?.destroy();
        initializingRef.current = false;
      } catch (error) {
        console.warn('Error destroying driver instance:', error);
      }
    };
  }, [loading, data, tourKey, steps, autoStart, markComplete]);

  const start = useCallback(() => {
    if (driverRef.current && isReady) {
      driverRef.current.drive();
    }
  }, [isReady]);

  const reset = useCallback(async () => {
    if (!allowReset || !driverRef.current) return;

    try {
      await markComplete({
        variables: {
          tutorialKey: tourKey,
          completed: false,
        },
      });
      driverRef.current.drive();
    } catch (error) {
      console.error(`Failed to reset tour '${tourKey}':`, error);
    }
  }, [allowReset, tourKey, markComplete]);

  return {
    start,
    reset: allowReset ? reset : undefined,
    isReady,
  };
}
