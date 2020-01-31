export interface Context {
    lines: string[];
    pos: number;
}

export namespace Context {

    export function extract(lines: string[], pos: number): Context {
        lines = filter_lines(lines);
        let joined_lines = join_lines(lines, pos);
        lines = joined_lines.lines;
        pos = joined_lines.pos;

        let non_ignored_lines = 0;
        let array_nesting = 0;
        let block_nesting = 0;
        let last_element_line = 0;
        let result: string[] = [];
        lines.reverse().forEach((l, i) => {
            if (i === 0)
                result.unshift(l);
            else {
                non_ignored_lines += 1
                l = l.trim();
                switch (l[l.length - 1]) {
                    case "{":
                        if (block_nesting > 0)
                            block_nesting -= 1;
                        else if (block_nesting === 0) {
                            result.unshift(l);
                            last_element_line = non_ignored_lines;
                        }
                        break;
                    case "}":
                        block_nesting += 1;
                        break;
                    case "[":
                        if (array_nesting > 0)
                            array_nesting -= 1;
                        else if (array_nesting === 0)
                            result.unshift(l);
                        break;
                    case "]":
                        array_nesting += 1;
                        break;
                    case ":":
                        // lable directly above element
                        if (non_ignored_lines === last_element_line + 1) {
                            result.unshift(l);
                        }
                        break;
                }
            }
        });
        return { lines: result, pos: pos };
    }

    function filter_lines(lines: string[]): string[] {
        return lines.filter((l) => {
            let ls = l.trim();
            return ls[0] != "@" && ls[0] != "#"
        });
    }

    function join_lines(lines: string[], pos: number) {
        let outlines: string[] = [];
        while (lines.length > 0) {
            outlines.push(lines.shift()!);
            while (lines.length > 0 &&
                (outlines[outlines.length - 1].match(/[,\\]\s*$/) ||
                    // don't join after a child label
                    (!outlines[outlines.length - 1].match(/^\s*\w+:/) &&
                        (outlines[outlines.length - 1].match(/\[\s*$/) ||
                            (lines[0].match(/^\s*\]/) && outlines[outlines.length - 1].match(/\[/)))))) {
                let l = lines.shift()!;
                outlines[outlines.length - 1] = outlines[outlines.length - 1].replace("\\", "");
                if (lines.length == 0) {
                    // the prefix might have whitespace on the
                    // right hand side which is relevant for the position
                    pos = outlines[outlines.length - 1].length + pos
                }
                outlines[outlines.length - 1].concat(l);
            }
        }
        return { lines: outlines, pos };
    }
}