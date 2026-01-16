const LINE = '──────────────────────────────────────────────────────';

const formatLogOutput = function({ title, sections }) {
  const lines = [];

  //console.log("OUTPUT HERE IS ",{title, sections})

  lines.push(LINE);
  lines.push(`${title}`);
  lines.push('');

  sections.forEach(section => {
    lines.push(`${section.label}`);
    section.entries.forEach(([key, value]) => {
      lines.push(`  → ${key}: ${value}`);
    });
    lines.push('');
  });

  lines.push('Ready.');
  lines.push(LINE);

  return lines.join('\n');
}

const startupFormatBlock = function(serverProps = {}) {

  // 1. Destructure props with defaults for cleaner access
  const {
    title = 'SpyneJS CMS Connected', // Handle the loose 'title' variable
    port = 8223,
    registryHost = 'localhost',
    registryPort = 52931,
    dataDirectory = '/src/static/data'
  } = serverProps;

  // 2. Build the Object directly (No JSON.parse needed)
  const getBlockData = () => {
    return {
      title,
      sections: [{
        label: 'Application',
        entries: [
          ['Local App Server', `http://localhost:${port}`]
        ]
      },
        {
          label: 'Registry',
          entries: [
            ['Spyne App Registry', `http://${registryHost}:${registryPort}`],
            ['Mode', 'Local'],
            ['Status', 'Active']
          ]
        },
        {
          label: 'CMS',
          entries: [
            ['Data Directory', dataDirectory],
            ['Adapter', '@spynejs/cms-adapter']
          ]
        }
      ]
    };
  };

  const data = getBlockData();
  const output = formatLogOutput(data);
  console.log(output)
};


module.exports = {startupFormatBlock, formatLogOutput}
