import { ElkNode } from 'elkjs';
import type { InferGetStaticPropsType } from 'next';
import React, { useEffect, useState } from 'react';
import ReactFlow, { Elements } from 'react-flow-renderer';
import { getAllCoursesFrom, getCourseRequirements } from '../../lib/courses';
import { layoutElements, renderElements } from '../../lib/generateLayout';
import { ICourse } from '../../types';

const Submap = ({ params }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const { prereqs, coreqs, descriptions, titles, eli } = params;

  // Remember courses whose requirements have already been loaded - avoid re-loading to be more efficient
  const initialReqsLoaded = new Set<string>();
  useState<Set<string>>(initialReqsLoaded);

  const [graph, setGraph] = useState<ElkNode>();
  const [elements, setElements] = useState<Elements>([]);

  // Compute layout of chart
  useEffect(() => {
    async function main() {
      const parsedGraph = await layoutElements(prereqs, coreqs, true);
      const newElements = await renderElements(parsedGraph, true);
      setGraph(parsedGraph);
      setElements(newElements);
    }
    main();
  }, [prereqs, coreqs]);

  const [currentlyHoveredId, setCurrentlyHoveredId] = useState<string>('');
  // Re-render chart
  useEffect(() => {
    if (graph) {
      const newElements = renderElements(graph, true, currentlyHoveredId);
      setElements(newElements);
    }
  }, [graph, currentlyHoveredId]);
  interface CourseInfoPopupParams {
    active: boolean; // whether the popup is currently active
    longTitle: string;
    course_no: string;
    desc: string;
    eli: string;
    locked: boolean;
  }
  // Mouse coordinates - determines where to display popup
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  // Parameters for course info popup (opened when mouse hovers over node)
  const getEmptyPopupParams = () => {
    return {
      active: false,
      longTitle: '',
      course_no: '',
      desc: '',
      eli: '',
      locked: false,
    } as CourseInfoPopupParams;
  };
  const initialPopupParams = getEmptyPopupParams();
  const [courseInfoPopupParams, setCourseInfoPopupParams] =
    useState<CourseInfoPopupParams>(initialPopupParams);
  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (courseInfoPopupParams.locked) return;
      setCoords({ x: e.pageX, y: e.pageY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [coords, courseInfoPopupParams.locked]);
  function CourseInfoPopup() {
    const cipp = courseInfoPopupParams;
    return (
      <div
        className="m-5 max-w-lg rounded-lg bg-gray-900/80 text-white backdrop-blur"
        style={{
          display: cipp.active ? 'block' : 'none',
          position: 'absolute',
          left: coords.x, // If there isn't enough margin/offset, nodeUnhoverCallback will trigger once this opens because the cursor will be over this popup instead of  the node
          top: coords.y,
          zIndex: 100,
        }}
      >
        <p className="ml-2 mr-2 mt-2 text-xl font-bold">
          {cipp.longTitle} · {cipp.course_no}
        </p>
        <p className="ml-2 mr-2 text-sm">{cipp.desc}</p>
        <p className="ml-2 mr-2 mb-2 text-sm italic">{cipp.eli}</p>
      </div>
    );
  }
  // Callbacks for when user moves cursors on/off nodes or clicks on nodes
  interface flowNode {
    id: string;
  }
  const nodeHoverCallback = (event: React.MouseEvent, node: flowNode) => {
    setCurrentlyHoveredId(node.id);
    if (courseInfoPopupParams.locked) return;
    const popupParams = {
      active: true,
      longTitle: titles[node.id],
      course_no: node.id,
      desc: descriptions[node.id],
      eli: eli[node.id],
      locked: false,
    } as CourseInfoPopupParams;
    setCourseInfoPopupParams(popupParams);
  };
  const nodeUnhoverCallback = () => {
    setCurrentlyHoveredId('');
    if (courseInfoPopupParams.locked) return;
    setCourseInfoPopupParams(getEmptyPopupParams());
  };
  // Lock/unlock course info popup when right click on popup
  const nodeRightClickCallback = (event: React.MouseEvent) => {
    event.preventDefault();
    const popupParams = courseInfoPopupParams;
    popupParams.locked = !popupParams.locked;
    setCourseInfoPopupParams(popupParams);
  };
  // Unlock course info popup when click on canvas
  const paneClickCallback = () => {
    setCourseInfoPopupParams(getEmptyPopupParams());
  };
  // Open the course page associated with this course
  const nodeClickCallback = (event: React.MouseEvent, element: flowNode) => {
    // check if element is an edge
    if (element.id.startsWith('pe') || element.id.startsWith('ce')) return;
    window.open(`/course/${element.id}`, '_self');
  };

  const reactFlowStyle = {
    background: `rgb(35, 35, 35)`,
  };

  return (
    <div>
      <div className="bg-exeter px-8 pt-16 pb-0 lg:px-40"></div>
      <div className="overflow-x-contain h-screen w-screen">
        <ReactFlow
          className="cursor-move shadow-md"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          selectNodesOnDrag={false}
          elements={elements}
          onNodeMouseEnter={nodeHoverCallback}
          onNodeMouseLeave={nodeUnhoverCallback}
          onElementClick={nodeClickCallback}
          onNodeContextMenu={nodeRightClickCallback}
          onPaneClick={paneClickCallback}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
          zoomOnScroll={false}
          panOnScroll={true}
          style={reactFlowStyle}
          defaultZoom={0.7}
        ></ReactFlow>
      </div>
      <CourseInfoPopup />
    </div>
  );
};

export async function getStaticPaths() {
  return {
    paths: [
      { params: { id: 'stemwithoutcs' } },
      { params: { id: 'cs' } },
      { params: { id: 'math' } },
      { params: { id: 'mathphysics' } },
      { params: { id: 'art' } },
      { params: { id: 'music' } },
      { params: { id: 'theater' } },
      { params: { id: 'history' } },
      { params: { id: 'classics' } },
      { params: { id: 'arabic' } },
      { params: { id: 'chinese' } },
      { params: { id: 'french' } },
      { params: { id: 'german' } },
      { params: { id: 'italian' } },
      { params: { id: 'japanese' } },
      { params: { id: 'russian' } },
      { params: { id: 'spanish' } },
      { params: { id: 'religion' } },
      { params: { id: 'english' } },
    ],
    fallback: false,
  };
}

// Grab all necessary information for every course
export async function getStaticProps({ params }: { params: { id: string } }) {
  let subjects: Set<string>;
  switch (params.id) {
    case 'art':
      subjects = new Set<string>(['ART']);
      break;
    case 'music':
      subjects = new Set<string>(['MUS']);
      break;
    case 'theater':
      subjects = new Set<string>(['THR']);
      break;
    case 'history':
      subjects = new Set<string>(['HIS']);
      break;
    case 'classics':
      subjects = new Set<string>(['LAT', 'GRK']);
      break;
    case 'english':
      subjects = new Set<string>(['ENG']);
      break;
    case 'religion':
      subjects = new Set<string>(['REL']);
      break;
    case 'arabic':
      subjects = new Set<string>(['ARA']);
      break;
    case 'chinese':
      subjects = new Set<string>(['CHI']);
      break;
    case 'french':
      subjects = new Set<string>(['FRE']);
      break;
    case 'german':
      subjects = new Set<string>(['GER']);
      break;
    case 'italian':
      subjects = new Set<string>(['ITA']);
      break;
    case 'japanese':
      subjects = new Set<string>(['JPN']);
      break;
    case 'russian':
      subjects = new Set<string>(['RUS']);
      break;
    case 'spanish':
      subjects = new Set<string>(['SPA']);
      break;
    case 'stemwithoutcs':
      subjects = new Set<string>(['CHE', 'BIO', 'PHY', 'MAT']);
      break;
    case 'cs':
      subjects = new Set<string>(['CSC']);
      break;
    case 'math':
      subjects = new Set<string>(['MAT']);
      break;
    case 'mathphysics':
      subjects = new Set<string>(['MAT', 'PHY']);
      break;
    default:
      subjects = new Set<string>();
  }
  const courses = getAllCoursesFrom(subjects);

  // Load prereqs/coreqs and detailed info for for each course
  const prereqs: Record<string, ICourse[]> = {};
  const coreqs: Record<string, ICourse[]> = {};
  const titles: Record<string, string | undefined> = {}; // Long titles
  const descriptions: Record<string, string | undefined> = {}; // Descriptions
  const eli: Record<string, string | undefined> = {}; // Eligibility requirements
  for (const course of courses) {
    const reqs = getCourseRequirements(course.course_no);
    prereqs[course.course_no] = reqs[0];
    coreqs[course.course_no] = reqs[1];
    descriptions[course.course_no] = course.desc;
    titles[course.course_no] = course.lt;
    eli[course.course_no] = course.eli;
  }

  return {
    props: {
      params: {
        courses: courses,
        prereqs: prereqs,
        coreqs: coreqs,
        descriptions: descriptions,
        titles: titles,
        eli: eli,
      },
    },
  };
}

export default Submap;
